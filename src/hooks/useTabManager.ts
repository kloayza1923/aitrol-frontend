import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { openTab, type Tab } from '@/store/slices/tabsSlice';
import { v4 as uuidv4 } from 'uuid';

export const useTabManager = () => {
  const dispatch = useDispatch();

  const addTab = useCallback(
    (path: string, title: string, closable = true) => {
      const tabId = uuidv4();
      const tab: Tab = {
        id: tabId,
        title,
        path,
        closable
      };
      dispatch(openTab(tab));
      return tabId;
    },
    [dispatch]
  );

  return {
    addTab
  };
};
