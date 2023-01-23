import { App } from "aws-cdk-lib"
import { Match, Template } from "aws-cdk-lib/assertions";
import { AppStack } from "../lib/app-stack";
import { ServiceStack } from "../lib/server-stack";

test('App Stack', () => {
    const app = new App();
    const stack = new AppStack(app, 'AppStack', {});

    expect(Template.fromStack(stack)).toMatchSnapshot();
})

test('Adding Service Stage', () => {

    const app = new App();
    const serviceStack = new ServiceStack(app, "ServiceStack");
    const pipelineStack = new AppStack(app, "AppStack");

    // when
    pipelineStack.addServiceStage(serviceStack, "Test");

    //then
    Template.fromStack(pipelineStack).hasResourceProperties("AWS::CodePipeline::Pipeline", {
        Stages: [
            {
                Name: "Source"
            },
            {
                Name: "Build"
            },
            {
                Name: "Pipeline_Update"
            },
            {
                Name: "Test"
            }
        ]
    });
})