/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { callWithTelemetryAndErrorHandling, IActionContext } from 'vscode-azureextensionui';
import { ext } from '../extensionVariables';
import { localize } from '../localize';

const awarenessToastShownKey = 'vscode-docker.awarenessToast.shown';
const minimumOverallSessions = 3;
const maximumNotEditOnlySessions = 0;

// TODO: text and link
const message = localize('vscode-docker.telemetry.awarenessToast.message', 'Do you want to learn more about the capabilities of the Docker extension?');
const button = localize('vscode-docker.telemetry.awarenessToast.button', 'Learn more');
const link = vscode.Uri.parse('https://code.visualstudio.com/docs/containers/overview');

export async function awarenessToast(): Promise<void> {
    // If it's been shown before, do not show it now
    if (ext.context.globalState.get<boolean>(awarenessToastShownKey, false)) {
        return;
    }

    await callWithTelemetryAndErrorHandling('awarenessToast', async (context: IActionContext) => {
        const eligible = isEligible();

        context.telemetry.properties.awarenessToastEligible = eligible.toString();

        if (await ext.experimentationService.isFlightEnabled('vscode-docker.awarenessToast')) {
            await ext.context.globalState.update(awarenessToastShownKey, true);

            const response = await vscode.window.showInformationMessage(message, button);

            if (response === button) {
                context.telemetry.properties.awarenessToastResponse = 'true';
                await vscode.env.openExternal(link);
            } else {
                context.telemetry.properties.awarenessToastResponse = 'false';
            }
        }
    });
}

function isEligible(): boolean {
    const overallActivity = ext.activityMeasurementService.getActivityMeasurement('overall');
    const noEditActivity = ext.activityMeasurementService.getActivityMeasurement('overallnoedit');

    return overallActivity.totalSessions >= minimumOverallSessions && noEditActivity.totalSessions <= maximumNotEditOnlySessions;
}