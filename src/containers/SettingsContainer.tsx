import React from 'react';
import { useAppStore } from '../store/appStore';
import SettingsComponent from '../components/Settings';

export default function Settings() {
  const {
    settings,
    handleSaveSettings,
    handleReset,
  } = useAppStore();

  return (
    <SettingsComponent
      settings={settings}
      onSave={handleSaveSettings}
      onReset={handleReset}
    />
  );
}
