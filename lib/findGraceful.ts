export type SearchResolver<T> = ((entry: T, index: number) => string)

const makeCompact = (key: string) => {
  return key.replaceAll(/\W/g, ``)
}
export function findGracefulIndex(needle: string, haystack: string[]): number | undefined
export function findGracefulIndex(needle: string, haystack: Record<string, unknown>[], searchResolver: string): number | undefined
export function findGracefulIndex<HaystackEntryGeneric>(needle: string, haystack: HaystackEntryGeneric[], searchResolver: SearchResolver<HaystackEntryGeneric>): number | undefined
export function findGracefulIndex<HaystackEntryGeneric>(needle: string, haystack: HaystackEntryGeneric[], searchResolver?: SearchResolver<HaystackEntryGeneric> | string) {
  const resolvedKeys: string[] = []
  let resolvedSearchResolver: SearchResolver<HaystackEntryGeneric>
  if (searchResolver === undefined) {
    resolvedSearchResolver = (entry: HaystackEntryGeneric) => <string> entry
  } else if (typeof searchResolver === `string`) {
    resolvedSearchResolver = (entry: HaystackEntryGeneric) => <string> entry[searchResolver]
  } else {
    resolvedSearchResolver = searchResolver
  }
  for (const [index, entry] of haystack.entries()) {
    const resolvedKey = resolvedSearchResolver(entry, index)
    if (resolvedKey === needle) {
      return index
    }
    resolvedKeys.push(resolvedKey)
  }
  const resolvedKeysLowercase = resolvedKeys.map(resolvedKey => resolvedKey.toLowerCase())
  const lowercasedNeedle = needle.toLowerCase()
  const index = resolvedKeysLowercase.indexOf(lowercasedNeedle)
  if (index !== -1) {
    return index
  }
  const compactNeedle = makeCompact(lowercasedNeedle)
  const gracefulIndex = resolvedKeysLowercase.findIndex(resolvedKey => makeCompact(resolvedKey) === compactNeedle)
  if (gracefulIndex !== -1) {
    return gracefulIndex
  }
}

// This function implementation is a clone of findGracefulIndex (only difference are the resolved indexes),
// but I don’t know how to pass down the arguments without getting TypeScript overload errors
export function findGraceful(needle: string, haystack: string[], searchResolver?: SearchResolver<string>): string | undefined
export function findGraceful<HaystackEntryGeneric extends Record<string, unknown>>(needle: string, haystack: HaystackEntryGeneric[], searchResolver: string): HaystackEntryGeneric | undefined
export function findGraceful<HaystackEntryGeneric>(needle: string, haystack: HaystackEntryGeneric[], searchResolver: SearchResolver<HaystackEntryGeneric>): HaystackEntryGeneric | undefined
export function findGraceful<HaystackEntryGeneric>(needle: string, haystack: HaystackEntryGeneric[], searchResolver?: SearchResolver<HaystackEntryGeneric> | string) {
  const resolvedKeys: string[] = []
  let resolvedSearchResolver: SearchResolver<HaystackEntryGeneric>
  if (searchResolver === undefined) {
    resolvedSearchResolver = (entry: HaystackEntryGeneric) => <string> entry
  } else if (typeof searchResolver === `string`) {
    resolvedSearchResolver = (entry: HaystackEntryGeneric) => <string> entry[searchResolver]
  } else {
    resolvedSearchResolver = searchResolver
  }
  for (const [index, entry] of haystack.entries()) {
    const resolvedKey = resolvedSearchResolver(entry, index)
    if (resolvedKey === needle) {
      return entry
    }
    resolvedKeys.push(resolvedKey)
  }
  const resolvedKeysLowercase = resolvedKeys.map(resolvedKey => resolvedKey.toLowerCase())
  const lowercasedNeedle = needle.toLowerCase()
  const index = resolvedKeysLowercase.indexOf(lowercasedNeedle)
  if (index !== -1) {
    return haystack[index]
  }
  const compactNeedle = makeCompact(lowercasedNeedle)
  const gracefulIndex = resolvedKeysLowercase.findIndex(resolvedKey => makeCompact(resolvedKey) === compactNeedle)
  if (gracefulIndex !== -1) {
    return haystack[gracefulIndex]
  }
}
