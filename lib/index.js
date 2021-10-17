const gql = require("graphql-tag").default
const { camelCase, upperFirst } = require('lodash')

module.exports = schemaGraphlCode => {
  const query = gql`${schemaGraphlCode}`

  let code = ''

  const operations = query.definitions.filter(definition => {
    return !!['mutation', 'query'].includes(definition.operation)
  })

  for (let operation of operations) {
    const hookName = `use${upperFirst(camelCase(operation.name.value))}`
    const hookParameters = operation.variableDefinitions.map(v => camelCase(v.variable.name.value)).join(', ')

    if (operation.operation === 'mutation') {
      code += (`
export const ${hookName} = ({ fallbackData, mutator, action = () => Promise.resolve() } = {}) => {
  const [status, setStatus] = useState(STATUSES.INIT);
  const [error, setError] = useState(null);

  const { data, mutate } = useSWR("${hookName}", { fallbackData });

  const mutateFunction = async (${hookParameters}) => {
    setStatus(STATUSES.LOADING);

    try {
      const nextData = await action(...[${hookParameters}])

      setStatus(STATUSES.SUCCEED);

      if (typeof mutator === 'function') {
        mutate(mutator(data, nextData));
      }
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
export const ${hookName} = ({ action = () => Promise.resolve(), fallbackData, mutator } = {}) => {
  const [status, setStatus] = useState(STATUSES.INIT);

  const { data, mutate, error } = useSWR("${hookName}", {
    fetcher: async (${hookParameters}) => {
      setStatus(STATUSES.LOADING)

      return await action(...[${hookParameters}])
    },
    fallbackData,
    onSuccess: () => {
      setStatus(STATUSES.SUCCEED)
    },
    onError: () => {
      setStatus(STATUSES.FAILED)
    },
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
    refreshInterval: 0
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

  return `
import useSWR from "swr";
import { useState } from "react";

export const STATUSES = {
  INIT: 1,
  LOADING: 2,
  FAILED: 3,
  SUCCEED: 4,
}
${code.replace(/\n$/, '')}
  `
}