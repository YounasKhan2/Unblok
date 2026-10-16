import React from 'react';
import {useKeyboard} from '../../context/KeyboardContext';
import {ShortcutsHelpView} from './ShortcutsHelpView';
export function ShortcutsHelpModal(){return <ShortcutsHelpView {...useKeyboard()}/>;}
