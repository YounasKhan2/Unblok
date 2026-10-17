import React from 'react';
import {useSettings} from '../context/SettingsContext';
import {ArchiveTeamModalFrame,type ArchiveTeamModalProps} from './ArchiveTeamModalFrame';
export const ArchiveTeamModal:React.FC<ArchiveTeamModalProps>=(props)=>{const {archiveTeam,canArchiveTeam}=useSettings();return <ArchiveTeamModalFrame {...props} archiveTeam={archiveTeam} canArchiveTeam={canArchiveTeam}/>;};
