import { App } from "aws-cdk-lib"
import { Template } from "aws-cdk-lib/assertions";
import { AppStack } from "../lib/app-stack";

test('App Stack', () => {
    const app = new App();
    const stack = new AppStack(app, 'AppStack', {});

    expect(Template.fromStack(stack)).toMatchSnapshot();
})