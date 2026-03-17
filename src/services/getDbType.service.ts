import { getAppsettingsContents } from './getAppsettings.service';

export function getDbType() {
    const appsettings = getAppsettingsContents();
    if (!appsettings) return;

    const databaseTypeJSON: string = appsettings?.config?.databaseType;
    return databaseTypeJSON;
}