export class TableauConnectionError extends Error {
  name = 'TableauConnectionError' as const
}

export class TableauDataError extends Error {
  name = 'TableauDataError' as const
}

export class SettingsPersistError extends Error {
  name = 'SettingsPersistError' as const
}
