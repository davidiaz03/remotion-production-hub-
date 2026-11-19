import React from 'react';
import {ClarityTest} from './diagrams/ClarityTest';
import {ConversationTypes} from './diagrams/ConversationTypes';
import {ExposureLadder} from './diagrams/ExposureLadder';
import {InputOutputOutcome} from './diagrams/InputOutputOutcome';
import {Looping} from './diagrams/Looping';
import {Love4Stages} from './diagrams/Love4Stages';
import {Pareto8020} from './diagrams/Pareto8020';
import {StatusVsCreation} from './diagrams/StatusVsCreation';

/** Despachador de los 8 diagramas dibujados en código (divs/SVG). */
export const Diagram: React.FC<{
  diagram: string;
  title?: string;
  notes?: string;
  durationInFrames: number;
}> = ({diagram, title, notes, durationInFrames}) => {
  const props = {title, notes, durationInFrames};
  switch (diagram) {
    case 'exposure-ladder':
      return <ExposureLadder {...props} />;
    case 'pareto-8020':
      return <Pareto8020 {...props} />;
    case 'input-output-outcome':
      return <InputOutputOutcome {...props} />;
    case 'love-4-stages':
      return <Love4Stages {...props} />;
    case 'looping':
      return <Looping {...props} />;
    case 'status-vs-creation':
      return <StatusVsCreation {...props} />;
    case 'conversation-types':
      return <ConversationTypes {...props} />;
    case 'clarity-test':
      return <ClarityTest {...props} />;
    default:
      return null;
  }
};
