import * as cdk from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import { BuildEnvironmentVariableType, BuildSpec, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { Artifact, IStage, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CloudFormationCreateUpdateStackAction, CodeBuildAction, CodeBuildActionType, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { EventField, RuleTargetInput } from 'aws-cdk-lib/aws-events';
import { SnsTopic } from 'aws-cdk-lib/aws-events-targets';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { BillingStack } from './billing-stack';
import { ServiceStack } from './service-stack';

export class AppStack extends cdk.Stack {
  private readonly pipeline: Pipeline;
  private readonly cdkBuildOutput: Artifact;
  private readonly serviceBuildOutput: Artifact;
  private readonly serviceSourceOutput: Artifact;
  private readonly pipelineNotificationsTopic: Topic;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.pipelineNotificationsTopic = new Topic(this, "PipelineNotificationsTopic", {
      topicName: "PipelineNotificationsTopic"
    })

    this.pipeline = new Pipeline(this, 'Pipeline', {
      pipelineName: 'Pipeline',
      crossAccountKeys: false,
      restartExecutionOnUpdate: true
    });

    const cdkSourceOutput = new Artifact('CDKSourceOutput');
    this.serviceSourceOutput = new Artifact('ServiceSourceOutput');

    this.pipeline.addStage({
      stageName:'Source',
      actions:[
        new GitHubSourceAction({
          owner: 'IntegralD-503',
          repo: 'aws-pipeline-demo',
          branch: 'main',
          actionName: 'Pipeline_Source',
          oauthToken: SecretValue.secretsManager('github-token'),
          output: cdkSourceOutput
        }),
        new GitHubSourceAction({
          owner: 'IntegralD-503',
          repo: 'express-lambda',
          branch: 'master',
          actionName: 'Service_Source',
          oauthToken: SecretValue.secretsManager('github-token'),
          output: this.serviceSourceOutput
        })
      ]
    });

    this.cdkBuildOutput = new Artifact("CdkBuildOutput");
    this.serviceBuildOutput = new Artifact("ServiceBuildOutput");

    this.pipeline.addStage({
      stageName: 'Build',
      actions: [
        new CodeBuildAction({
          actionName: 'CDK_Build',
          input: cdkSourceOutput,
          outputs: [ this.cdkBuildOutput ],
          project: new PipelineProject(this, 'CdkBuildProject', {
            environment: {
              buildImage: LinuxBuildImage.AMAZON_LINUX_2_4
            },
            buildSpec: BuildSpec.fromSourceFilename('build-specs/cdk-build-spec.yml')
          })
        }),
        new CodeBuildAction({
          actionName: 'Service_Build',
          input: this.serviceSourceOutput,
          outputs: [ this.serviceBuildOutput ],
          project: new PipelineProject(this, 'ServiceBuildProject', {
            environment: {
              buildImage: LinuxBuildImage.AMAZON_LINUX_2_4
            },
            buildSpec: BuildSpec.fromSourceFilename('build-specs/service-build-spec.yml')
          })
        })
      ]
    })

    this.pipeline.addStage({
      stageName: 'Pipeline_Update',
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: 'Pipeline_Update',
          stackName: 'AppStack',
          templatePath: this.cdkBuildOutput.atPath('AppStack.template.json'),
          adminPermissions: true,
        })
      ]
    });
  }

  public addServiceStage(serviceStack: ServiceStack, stageName: string): IStage {
    return this.pipeline.addStage({
      stageName: stageName,
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: 'Service_Update',
          stackName: serviceStack.stackName,
          templatePath: this.cdkBuildOutput.atPath(`${serviceStack.stackName}.template.json`),
          adminPermissions: true,
          parameterOverrides: {
            ...serviceStack.serviceCode.assign(this.serviceBuildOutput.s3Location)
          },
          extraInputs: [this.serviceBuildOutput]
        })
      ]
    })
  }

  public addBillingStackToStage(billingStack: BillingStack, stage: IStage) {
    stage.addAction(new CloudFormationCreateUpdateStackAction({
      actionName: 'Billing_Update',
      stackName: billingStack.stackName,
      templatePath: this.cdkBuildOutput.atPath(`${billingStack.stackName}.template.json`),
      adminPermissions: true
    }));
  }

  public addServiceIntegrationTest(stage: IStage, serviceEndpoint: string) {
    
    const integTestAction = new CodeBuildAction({
      actionName: "Integration_Tests",
      input: this.serviceSourceOutput,
      project: new PipelineProject(this, "ServiceIntegrationTestsProject", {
        environment: {
          buildImage: LinuxBuildImage.AMAZON_LINUX_2_4
        },
        buildSpec: BuildSpec.fromSourceFilename('build-specs/integ-test-build-spec.yml')
      }),
      environmentVariables: {
        SERVICE_ENDPOINT: {
          value: serviceEndpoint,
          type: BuildEnvironmentVariableType.PLAINTEXT
        }
      },
      type: CodeBuildActionType.TEST,
      runOrder: 2
    })
    
    stage.addAction(integTestAction);
    integTestAction.onStateChange("IntegrationTestFailed", new SnsTopic(this.pipelineNotificationsTopic, {
      message: RuleTargetInput.fromText(`Integration Test Failed. See details here: ${EventField.fromPath(
        "$.detail.execution-result.external-execution-url"
      )}`)
    }),
    {
      ruleName: "IntgrationTestFailed",
      eventPattern: {
        detail: {
          state: ["FAILED"]
        }
      },
      description: "Integration test has failed"
    })
  }
}