import { Box } from '@mui/material';
import SceneArea from './SceneArea';

type SceneKey = 'a' | 'b';


interface SceneAProps {
    name: SceneKey;
}

export default function Scene({
    name = 'a',
}: SceneAProps) {


    const areas: Record<SceneKey, string[]> = {
        a: ['Egyes', 'Kettes', 'Hármas', 'Négyes'],
        b: ['Ötös', 'Hatos', 'Hetes', 'Nyolcas', 'Kilences'],
    };


    return (
        <Box sx={{
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
        }}>
            {areas[name].map((areaName, i) => (
                <SceneArea
                    key={i}
                    name={areaName}
                    height={100 / (areas[name].length + 1)}
                />
            ))}
            <SceneArea
                empty
                height={100 / (areas[name].length + 1)}
            />
        </Box>
    );
}
