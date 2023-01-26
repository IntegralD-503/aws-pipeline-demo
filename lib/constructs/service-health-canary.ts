import { Canary, Runtime, Schedule, Test } from "@aws-cdk/aws-synthetics-alpha";
import { Duration } from "aws-cdk-lib";
import { Code } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as fs from "fs";
import * as path from "path";

interface ServiceHealthCanaryProps {
    apiEndpoint: string;
    canaryName: string;
}
export class ServiceHealthCanary extends Construct {
    constructor(scope: Construct, id: string, props: ServiceHealthCanaryProps) {
        super(scope,id);

        new Canary(this, props.canaryName, {
            runtime: Runtime.SYNTHETICS_NODEJS_2_0,
            canaryName: props.canaryName,
            schedule: Schedule.rate(Duration.minutes(1)),
            environmentVariables: {
                API_ENDPOINT: props.apiEndpoint,
                DEPLOYMENt_TRIGGER: Date.now().toString(), // every deployment changes this value and thus reruns canary
            },
            test: Test.custom({
                code: Code.fromInline(fs.readFileSync(path.join(__dirname, "../../canary/canary.ts"), "utf8")),
                handler: "index.handler"
            }),
            timeToLive: Duration.minutes(5) // canary will run for 5 minutes
        })
    }
}