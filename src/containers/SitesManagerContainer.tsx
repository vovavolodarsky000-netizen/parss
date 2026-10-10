import React from 'react';
import { useAppStore } from '../store/appStore';
import SitesManagerComponent from '../components/SitesManager';

export default function SitesManager() {
  const {
    sites,
    handleAddSite,
    handleRemoveSite,
    handleToggleSite,
    handleUpdateSite,
    handleParse,
    isParsing,
  } = useAppStore();

  return (
    <SitesManagerComponent
      sites={sites}
      onAdd={handleAddSite}
      onRemove={handleRemoveSite}
      onToggle={handleToggleSite}
      onUpdate={handleUpdateSite}
      onParse={handleParse}
      isParsing={isParsing}
    />
  );
}
