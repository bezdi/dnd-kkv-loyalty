import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Paper, Typography } from '@mui/material';
import type { CardData, SceneId } from '@/types/card';

interface Props {
    id: string;
    card: CardData;
    scene: SceneId;
    activeCardId: string | null;
    zOrder: string[]; // <- new prop to determine stacking order
}

export const DraggableCard: React.FC<Props> = ({ id, card, scene, activeCardId, zOrder }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
    const index = zOrder.indexOf(card.id);


    const pos = card.positions[scene];
    const style = {
        position: 'absolute' as const,
        left: transform ? pos.x + (transform.x ?? 0) : pos.x,
        top: transform ? pos.y + (transform.y ?? 0) : pos.y,
        width: 260,
        minHeight: 80,
        padding: 1,
        cursor: 'grab',
        border: '1px solid #ccc',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease, transform 0.2s ease',
        transform: isDragging ? 'scale(1.02)' : 'none',
        zIndex: index >= 0 ? 100 + index : 1, // Base 100 to stay above background
    };

    return (
        <Paper
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            sx={style}
            elevation={isDragging ? 6 : 0}
        >
            <Typography variant='body2'>
                {card.text}
            </Typography>
        </Paper>
    );
};
