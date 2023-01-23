import { App } from "aws-cdk-lib"
import { Capture, Match, Template } from "aws-cdk-lib/assertions";
import { AppStack } from "../lib/app-stack";
import { BillingStack } from "../lib/billing-stack";
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

    Template.fromStack(pipelineStack).hasResourceProperties("AWS::CodePipeline::Pipeline", {
        Stages: Match.arrayWith( [
            Match.objectLike({
                Name: "Test",
            })
        ])
    })
})

test("Adding Billing Stack to a Stage", () => {
    const app = new App();
    const serviceStack = new ServiceStack(app, "ServiceStack");
    const pipelineStack = new AppStack(app, "AppStack");
    const billingStack = new BillingStack(app, 'BillingStack', {
        budgetAmount: 5,
        emailAddress: "test@example.com"
    });

    const testStage = pipelineStack.addServiceStage(serviceStack, "Test");

    pipelineStack.addBillingStackToStage(billingStack, testStage);

    Template.fromStack(pipelineStack).hasResourceProperties("AWS::CodePipeline::Pipeline", {
        Stages: Match.arrayWith([
            Match.objectLike({
                Actions: Match.arrayWith([
                    Match.objectLike( {
                        Name: "Billing_Update",
                    })
                ])
            })
        ])
    });
})