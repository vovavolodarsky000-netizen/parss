import React from 'react';
import { useAppStore } from '../store/appStore';
import ChannelsListComponent from '../components/ChannelsList';

export default function ChannelsList() {
  const {
    channels,
    handleAddChannel,
    handleRemoveChannel,
    handleToggleChannel,
  } = useAppStore();

  return (
    <ChannelsListComponent
      channels={channels}
      onAdd={handleAddChannel}
      onRemove={handleRemoveChannel}
      onToggle={handleToggleChannel}
    />
  );
}
