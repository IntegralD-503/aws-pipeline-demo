import { BuildSpec, LinuxBuildImage, PipelineProject } from '@aws-cdk/aws-codebuild';
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline';
import { CloudFormationCreateUpdateStackAction, CodeBuildAction, GitHubSourceAction } from '@aws-cdk/aws-codepipeline-actions';
import * as cdk from '@aws-cdk/core';
import { SecretValue } from '@aws-cdk/core';

export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const pipeline = new Pipeline(this, 'Pipeline', {
      pipelineName: 'Pipeline',
      crossAccountKeys: false
    });

    const cdkSourceOutput = new Artifact('CDKSourceOutput');
    const serviceSourceOutput = new Artifact('ServiceSourceOutput');

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new GitHubSourceAction( {
          owner: 'IntegralD-503',
          repo: 'aws-pipeline-demo',
          branch: 'main',
          actionName: 'Pipeline_Source',
          oauthToken: SecretValue.secretsManager('github-pipeline-demo-token'),
          output: cdkSourceOutput

        }),
        new GitHubSourceAction( {
          owner: 'IntegralD-503',
          repo: 'express-lambda',
          branch: 'main',
          actionName: 'Service_Source',
          oauthToken: SecretValue.secretsManager('github-pipeline-demo-token'),
          output: serviceSourceOutput

        })
      ]
    });

    const cdkBuildOutput = new Artifact('CdkBuildOutput');

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new CodeBuildAction({
          actionName: 'CDK_Build',
          input: cdkSourceOutput,
          outputs: [cdkBuildOutput],
          project: new PipelineProject(this, 'CdkBuildProject', {
            environment: {
              buildImage: LinuxBuildImage.STANDARD_5_0
            },
            buildSpec: BuildSpec.fromSourceFilename('build-specs/cdk-build-spec.yml')
          })
        })
      ]
    })

    pipeline.addStage({
      stageName: 'Pipeline_Update',
      actions: [ new CloudFormationCreateUpdateStackAction({
        actionName: 'Pipeline_Update',
        stackName: 'PipelineStack',
        templatePath: cdkBuildOutput.atPath('PipelineStack.template.json'),
        adminPermissions: true
      })]
    })
  }
}
