
import useSWR from "swr";
import { useState } from "react";

export const STATUSES = {
  INIT: 1,
  LOADING: 2,
  FAILED: 3,
  SUCCEED: 4,
}

export const useGetData = ({ action = () => Promise.resolve(), fallbackData, mutator } = {}) => {
  const [status, setStatus] = useState(STATUSES.INIT);

  const { data, mutate, error } = useSWR("useGetData", {
    fetcher: async () => {
      setStatus(STATUSES.LOADING)

      return await action(...[])
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

export const useCreateData = ({ fallbackData, mutator, action = () => Promise.resolve() } = {}) => {
  const [status, setStatus] = useState(STATUSES.INIT);
  const [error, setError] = useState(null);

  const { data, mutate } = useSWR("useCreateData", { fallbackData });

  const mutateFunction = async (name) => {
    setStatus(STATUSES.LOADING);

    try {
      const nextData = await action(...[name])

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
  