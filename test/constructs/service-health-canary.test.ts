import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Topic } from "aws-cdk-lib/aws-sns";
import { ServiceHealthCanary } from "../../lib/constructs/service-health-canary";

test('SericeHealthCanary', () => {
    const app = new App();
    const stack = new Stack(app, "TestStack")

    new ServiceHealthCanary(stack, "TestCanary", {
        apiEndpoint: "api.example.com",
        canaryName: "test-canary",
        alarmTopic: new Topic(stack, "TestAlarmTopic")
    });

    Template.fromStack(stack).hasResourceProperties("AWS::Synthetics::Canary", {
        RunConfig: {
            EnvironmentVariables: {
                API_ENDPOINT: "api.example.com"
            }
        }
    })
})