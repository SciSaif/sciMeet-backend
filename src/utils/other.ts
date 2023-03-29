export function ensureError(err: unknown) {
    if (err instanceof Error) {
        return err;
    }
    return new Error(`Caught a non-error value ${err}`);
}
