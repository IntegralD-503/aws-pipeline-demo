import { CfnBudget } from "aws-cdk-lib/aws-budgets";
import { Construct } from "constructs";

interface BudgetProps {
    budgetAmount: number,
    emailAddress: string
}

export class Budget extends Construct {
    constructor(scope: Construct, id: string, props: BudgetProps) {
        super(scope, id)

        new CfnBudget(this, 'Budget', {
            budget: {
                budgetType: 'COST',
                budgetName: 'Monthly Budget',
                timeUnit: 'MONTHLY',
                budgetLimit: {
                    amount: props.budgetAmount,
                    unit: 'USD'
                }
            },
            notificationsWithSubscribers: [
                {
                    notification: {
                        comparisonOperator: 'GREATER_THAN',
                        notificationType: 'ACTUAL',
                        threshold: 100,
                        thresholdType: 'PERCENTAGE'
                    },
                    subscribers: [{
                        address: props.emailAddress,
                        subscriptionType: 'EMAIL'
                    }]
                }
            ]
        })
    }
}