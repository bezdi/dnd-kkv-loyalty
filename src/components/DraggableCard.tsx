import { useDraggable } from '@dnd-kit/core';
import { Paper, Typography, Tooltip } from '@mui/material';
import type { CardData, SceneId } from '@/types/card';

interface Props {
    id: string;
    card: CardData;
    scene: SceneId;
    activeSet: string;
    activeCardId: string | null;
    zOrder: string[];
    color?: string;
    borderColor?: string;
    highlighted?: boolean;
    tooltip?: string;
}

export const DraggableCard: React.FC<Props> = ({
    id,
    card,
    scene,
    activeSet,
    activeCardId,
    zOrder,
    color = "#F2F6FA",
    borderColor = "#E0E0E0",
    highlighted = false,
    tooltip,
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
    const index = zOrder.indexOf(card.id);

    // fallback position: (0,0) if none is saved yet for this scene+set
    const pos = card.positions[scene]?.[activeSet] ?? { x: 0, y: 0 };

    const style = {
        position: 'absolute' as const,
        left: transform ? pos.x + (transform.x ?? 0) : pos.x,
        top: transform ? pos.y + (transform.y ?? 0) : pos.y,
        width: 220,
        minHeight: 80,
        py: 1,
        px: 1,
        cursor: 'grab',
        border: `1px solid ${color}`,
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease, transform 0.2s ease',
        transform: isDragging ? 'scale(1.02)' : 'none',
        zIndex: index >= 0 ? 100 + index : 1,
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        textAlign: 'center',
        "&:hover": {
            zIndex: 1000,
            border: `1px solid ${borderColor}`,
        },
        "&.highlighted": {
            zIndex: 1000,
            boxShadow: `0 0 10px ${borderColor}`,
            border: "1px solid",
            borderColor: "secondary.main",
        },
    };

    const cardContent = (
        <Paper
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            sx={style}
            elevation={isDragging ? 6 : 0}
            className={`draggable-card ${highlighted ? 'highlighted' : ''}`}
        >
            <Typography variant='body2'>
                {card.text}
            </Typography>
        </Paper>
    );

    return tooltip ? (
        <Tooltip title={tooltip} disableInteractive arrow>
            {cardContent}
        </Tooltip>
    ) : (
        cardContent
    );
};
