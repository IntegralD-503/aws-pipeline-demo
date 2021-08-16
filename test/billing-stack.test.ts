import { SynthUtils } from "@aws-cdk/assert";
import { App } from "@aws-cdk/core"
import { BillingStack } from "../lib/BillingStack";

test("Billing Stack", () => {
    const app = new App();
    const stack = new BillingStack(app, "BillingStack", {
        budgetAmount: 1,
        emailAddress: "budgetGuy@aol.com"
    });

    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
})