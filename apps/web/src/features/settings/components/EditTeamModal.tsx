import React from 'react';
import {useSettings} from '../context/SettingsContext';
import {EditTeamModalFrame,type EditTeamModalProps} from './EditTeamModalFrame';
export const EditTeamModal:React.FC<EditTeamModalProps>=props=>{const {updateTeam}=useSettings();return <EditTeamModalFrame {...props} updateTeam={updateTeam}/>;};
