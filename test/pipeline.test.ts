import { arrayWith, haveResourceLike, objectLike, SynthUtils } from '@aws-cdk/assert';
import { App } from '@aws-cdk/core';
import { PipelineStack } from '../lib/pipeline-stack';
import { ServiceStack } from '../lib/service-stack';
import { expect as expectCDK } from "@aws-cdk/assert";

test('Empty Stack', () => {
    const app = new App();
    // WHEN
    const stack = new PipelineStack(app, 'MyTestStack');
    // THEN
    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});

test("Adding service stage", () => {
    // GIVEN
    const app = new App();
    const serviceStack = new ServiceStack(app, "ServiceStack");
    const pipelineStack = new PipelineStack(app, "PipelineStack");
    
    // WHEN
    pipelineStack.addServiceStage(serviceStack, "Test");

    // THEN
    expectCDK(pipelineStack).to(haveResourceLike("AWS::CodePipeline::Pipeline", {
        Stages: arrayWith(objectLike({
            Name: "Test"
        }))
    }))
})
