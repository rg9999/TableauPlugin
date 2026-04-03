export class TableauConnectionError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'TableauConnectionError'
  }
}

export class TableauDataError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'TableauDataError'
  }
}

export class SettingsPersistError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'SettingsPersistError'
  }
}
