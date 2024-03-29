import { App, Stack } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { Budget } from "../../lib/constructs/budget";

test('Budget construct', () => {
    const app  = new App();
    const stack = new Stack(app, 'Stack');

    new Budget(stack, 'Budget', {
        budgetAmount: 1,
        emailAddress: "test@email.com"
    });

    Template.fromStack(stack).hasResourceProperties("AWS::Budgets::Budget", {
        Budget: {
          BudgetLimit: {
            Amount: 1,
          },
        },
        NotificationsWithSubscribers: [
          Match.objectLike({
            Subscribers: [
              {
                Address: "test@email.com",
                SubscriptionType: "EMAIL",
              },
            ],
          }),
        ],
      });
})


