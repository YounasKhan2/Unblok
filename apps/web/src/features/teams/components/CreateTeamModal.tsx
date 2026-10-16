import React from 'react';
import {useProject} from '../../../context/ProjectContext';
import {CreateTeamModalFrame,type CreateTeamModalProps} from './CreateTeamModalFrame';
export const CreateTeamModal:React.FC<CreateTeamModalProps>=props=>{const {teams,currentUser,createTeam}=useProject();return <CreateTeamModalFrame {...props} teams={teams} isAdmin={currentUser.role==='ADMIN'} createTeam={createTeam}/>;};
