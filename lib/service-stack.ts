import { HttpApi } from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import { Stats, TreatMissingData } from "aws-cdk-lib/aws-cloudwatch";
import { LambdaDeploymentConfig, LambdaDeploymentGroup } from "aws-cdk-lib/aws-codedeploy";
import { Alias, CfnParametersCode, Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface ServiceStackProps extends StackProps{
    stageName: string;
}

export class ServiceStack extends Stack {
    public readonly serviceCode: CfnParametersCode;
    public readonly serviceEndpointOutput: CfnOutput;
    
    constructor(scope: Construct, id: string, props: ServiceStackProps){
        super(scope, id, props)

        this.serviceCode = Code.fromCfnParameters()

        const lambda = new Function(this, 'ServiceLambda', {
            runtime: Runtime.NODEJS_14_X,
            handler: 'src/lambda.handler',
            code: this.serviceCode,
            functionName: `ServiceLambda${props.stageName}`,
            description:`Generated on ${new Date().toISOString()}`
        })

        const alias = new Alias(this, 'ServiceLambdaAlias', {
            version: lambda.currentVersion,
            aliasName: `ServiceLambdaAlias${props.stageName}`
        })

        const httpApi = new HttpApi(this, 'ServiceApi', {
            defaultIntegration: new HttpLambdaIntegration("LambdaIntegration", lambda),
            apiName: `MyService${props.stageName}`
        })

        if (props.stageName === 'Prod') {
            new LambdaDeploymentGroup(this, 'DeploymentGroup', {
                alias: alias,
                deploymentConfig: LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
                autoRollback: {
                    deploymentInAlarm: true
                },
                alarms: [
                    httpApi.metricServerError()
                    .with({
                        period: Duration.minutes(1),
                        statistic: Stats.SUM
                    }).createAlarm(this, 'ServiceErrorAlarm', {
                        threshold: 1,
                        alarmDescription: "Service is experiencing errors",
                        alarmName: `ServiceErrorAlarm${props.stageName}`,
                        evaluationPeriods: 1,
                        treatMissingData: TreatMissingData.NOT_BREACHING
                    })
                ]
            })
        }

       this.serviceEndpointOutput = new CfnOutput(this, "ApiEndpointOutput", {
            exportName: `ServiceEndpoint${props.stageName}`,
            value: httpApi.apiEndpoint,
            description: 'API Endpoint'
        })
    }
}