/** 用于累计经过时间；只在客户端挂载后或事件中读取，不受系统时钟校准影响。 */
export function getMonotonicMilliseconds(): number {
    return globalThis.performance.now()
}
