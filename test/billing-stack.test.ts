import { App } from "aws-cdk-lib"
import { Template } from "aws-cdk-lib/assertions";
import { BillingStack } from "../lib/billing-stack";

test('Billing Stack', () => {
    const app = new App();
    const stack = new BillingStack(app, 'BillingStack', {
        budgetAmount: 1,
        emailAddress: 'test@email.com'
    });

    expect(Template.fromStack(stack)).toMatchSnapshot();
})