import { App, Stack } from "@aws-cdk/core"
import { Budget } from "../../lib/constructs/budget";
import { countResources, expect as expectCDK, haveResource, haveResourceLike } from "@aws-cdk/assert";

test("Budget construct", () => {
    const app = new App();
    const stack = new Stack(app, "Stack");

    new Budget(stack, "Budget", {
        budgetAmount: 1,
        emailAddress: "budgetGuy@aol.com"
    });

    expectCDK(stack).to(haveResource("AWS::Budgets::Budget"));

    expectCDK(stack).to(countResources('AWS::Budgets::Budget', 1));

    expectCDK(stack).to(haveResourceLike("AWS::Budgets::Budget", {
        Budget: {
            BudgetLimit: {
                Amount: 1
            },
        },
        NotificationsWithSubscribers: [
            {
                Subscribers: [
                    {
                        Address: "budgetGuy@aol.com"
                    }
                ]
            }
        ]
        
    }));
})