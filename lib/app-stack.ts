import * as cdk from 'aws-cdk-lib';
import { SecretValue } from 'aws-cdk-lib';
import { BuildSpec, LinuxBuildImage, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { CloudFormationCreateUpdateStackAction, CodeBuildAction, GitHubSourceAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new Pipeline(this, 'Pipeline', {
      pipelineName: 'Pipeline',
      crossAccountKeys: false,
      restartExecutionOnUpdate: true
    });

    const cdkSourceOutput = new Artifact('CDKSourceOutput');
    const serviceSourceOutput = new Artifact('ServiceSourceOutput');

    pipeline.addStage({
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
          branch: 'main',
          actionName: 'Service_Source',
          oauthToken: SecretValue.secretsManager('github-token'),
          output: serviceSourceOutput
        })
      ]
    });

    const cdkBuildOutput = new Artifact("CdkBuildOutput");
    const serviceBuildOutput = new Artifact("ServiceBuildOutput");

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new CodeBuildAction({
          actionName: 'CDK_Build',
          input: cdkSourceOutput,
          outputs: [ cdkBuildOutput ],
          project: new PipelineProject(this, 'CdkBuildProject', {
            environment: {
              buildImage: LinuxBuildImage.AMAZON_LINUX_2_4
            },
            buildSpec: BuildSpec.fromSourceFilename('build-specs/cdk-build-spec.yml')
          })
        }),
        new CodeBuildAction({
          actionName: 'Service_Build',
          input: serviceSourceOutput,
          outputs: [ serviceBuildOutput ],
          project: new PipelineProject(this, 'ServiceBuildProject', {
            environment: {
              buildImage: LinuxBuildImage.AMAZON_LINUX_2_4
            },
            buildSpec: BuildSpec.fromSourceFilename('build-specs/service-build-spec.yml')
          })
        })
      ]
    })

    pipeline.addStage({
      stageName: 'Pipeline_Update',
      actions: [
        new CloudFormationCreateUpdateStackAction({
          actionName: 'Pipeline_Update',
          stackName: 'AppStack',
          templatePath: cdkBuildOutput.atPath('AppStack.template.json'),
          adminPermissions: true,
        })
      ]
    })
  }
}