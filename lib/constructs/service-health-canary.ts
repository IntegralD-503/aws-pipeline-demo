import { Canary, Runtime, Schedule, Test } from "@aws-cdk/aws-synthetics-alpha";
import { Duration } from "aws-cdk-lib";
import { Stats, TreatMissingData } from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { Code } from "aws-cdk-lib/aws-lambda";
import { Topic } from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import * as fs from "fs";
import * as path from "path";

interface ServiceHealthCanaryProps {
    apiEndpoint: string;
    canaryName: string;
    alarmTopic: Topic;
}
export class ServiceHealthCanary extends Construct {
    constructor(scope: Construct, id: string, props: ServiceHealthCanaryProps) {
        super(scope,id);

        const canary = new Canary(this, props.canaryName, {
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
            timeToLive: Duration.minutes(5) // canary will run for 5 minutes after deployment
        });

        const canaryFailedMetric = canary.metricFailed({
            period: Duration.minutes(1),
            statistic: Stats.SUM,
            label: `${props.canaryName} Failed`,
        });

        const canaryFailedAlarm = canaryFailedMetric.createAlarm(this, `${props.canaryName}FailedAlarm`, {
            threshold: 1,
            alarmDescription: `${props.canaryName} has failed`,
            evaluationPeriods: 1,
            treatMissingData: TreatMissingData.NOT_BREACHING,
            alarmName: `${props.canaryName}FailedAlarm`
        });

        canaryFailedAlarm.addAlarmAction(new SnsAction(props.alarmTopic));
    }
}