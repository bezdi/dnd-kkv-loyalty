import { Box } from '@mui/material';
import SceneArea from './SceneArea';
import sceneAreas from '@/data/scenes.json';

type SceneKey = keyof typeof sceneAreas;

interface SceneProps {
    name: SceneKey;
    label?: string;
}

export default function Scene({ name, label }: SceneProps) {
    const areas = sceneAreas[name] || [];

    return (
        <Box
            sx={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
            }}
        >
            {areas.map((areaName, i) => (
                <SceneArea
                    key={i}
                    name={areaName}
                    height={100 / (areas.length + 1)}
                />
            ))}
            <SceneArea
                empty
                height={100 / (areas.length + 1)}
                label={label}
            />
        </Box>
    );
}
