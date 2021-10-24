const gql = require("graphql-tag").default
const { constantCase } = require('constant-case')
const { camelCase, upperFirst } = require('lodash')

module.exports = schemaGraphlCode => {
  const query = gql`${schemaGraphlCode}`

  let code = ''
  const queryKeys = {};

  const operations = query.definitions.filter(definition => {
    return !!['mutation', 'query'].includes(definition.operation)
  })

  for (let operation of operations) {
    const queryName = upperFirst(camelCase(operation.name.value))
    const queryKey = constantCase(queryName)

    queryKeys[queryKey] = queryKey

    const hookName = `use${queryName}`
    const hookParameters = operation.variableDefinitions.map(v => camelCase(v.variable.name.value)).join(', ')

    if (operation.operation === 'mutation') {
      code += (`
export const ${hookName} = ({
  action = () => Promise.resolve(),
  mutator,
  options = {}
} = {}) => {
  const [status, setStatus] = useState(STATUSES.INIT);
  const [error, setError] = useState(null);

  const { data, mutate } = useSWR("${hookName}", { fallbackData: options.fallbackData });

  const mutateFunction = async (${hookParameters}) => {
    setStatus(STATUSES.LOADING);

    try {
      const nextData = await action(...[${hookParameters}])

      setStatus(STATUSES.SUCCEED);

      if (typeof mutator === 'function') {
        return mutate(mutator(data, nextData));
      }

      return mutate(nextData);
    } catch (error) {
      setStatus(STATUSES.FAILED);

      setError(error)
    }
  }

  return {
    data,
    error,
    status,
    mutate: mutateFunction
  };
}
`)
    }

    if (operation.operation === 'query') {
      code += (`
export const ${hookName} = ({
  action = () => Promise.resolve(),
  options = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
    refreshInterval: 0
  },
} = {}) => {
  const [status, setStatus] = useState(STATUSES.INIT);

  const { data, mutate, error } = useSWR("${hookName}", {
    fetcher: async (${hookParameters}) => {
      setStatus(STATUSES.LOADING)

      return await action(...[${hookParameters}])
    },
    onSuccess: () => {
      setStatus(STATUSES.SUCCEED)
    },
    onError: () => {
      setStatus(STATUSES.FAILED)
    },
    fallbackData: options.fallbackData,
    revalidateOnFocus: options.revalidateOnFocus,
    revalidateOnReconnect: options.revalidateOnReconnect,
    refreshWhenOffline: options.refreshWhenOffline,
    refreshWhenHidden: options.refreshWhenHidden,
    refreshInterval: options.refreshInterval
  });

  return {
    data,
    error,
    status,
    mutate
  };
}
`)
    }

  }

  return `import useSWR from "swr";
import { useState } from "react";

export const STATUSES = {
  INIT: 1,
  LOADING: 2,
  FAILED: 3,
  SUCCEED: 4,
}

export const QUERY_KEYS = ${JSON.stringify(queryKeys, null, 2)}
${code.replace(/\n$/, '')}
  `
}