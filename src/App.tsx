import { useState, useEffect, useRef, useMemo } from 'react';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './App.css';
import rawCards from '@/data/cards.json';
import type { CardData, Position, SceneId } from '@/types/card';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import ReplayIcon from '@mui/icons-material/Replay';
import html2canvas from 'html2canvas';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import {
    Box, Button, ButtonGroup, Dialog, DialogActions, DialogContent, DialogContentText,
    DialogTitle, FormControl, Grid, IconButton, InputLabel, List, ListItem, MenuItem,
    Paper, Select, Stack, Tab, Tabs, Tooltip, Typography
} from '@mui/material';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import type { DragEndEvent } from '@dnd-kit/core';
import { DraggableCard } from './components/DraggableCard';

const SCENES: SceneId[] = ['a', 'b'];

const initializeCards = (): CardData[] => {
    const saved = localStorage.getItem('cards');
    if (saved) return JSON.parse(saved);
    return rawCards.map(card => ({
        ...card,
        picked: false,
        positions: SCENES.reduce((acc, scene) => ({ ...acc, [scene]: { x: 0, y: 0 } }), {} as Record<SceneId, Position>)
    }));
};

const initializeZOrder = (): Record<SceneId, string[]> => {
    const saved = localStorage.getItem('zOrder');
    if (saved) return JSON.parse(saved);
    return SCENES.reduce((acc, scene) => ({ ...acc, [scene]: [] }), {} as Record<SceneId, string[]>);
};

export default function App() {
    const theme = createTheme({});
    const sceneRef = useRef<HTMLDivElement>(null);

    const [activeSet, setActiveSet] = useState<string>('1');
    const [activeScene, setActiveScene] = useState<SceneId>('a');
    const [cards, setCards] = useState<CardData[]>(initializeCards);
    const [lastDraggedCardId] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [shortcutOpen, setShortcutOpen] = useState(false);
    const [zOrder, setZOrder] = useState<Record<SceneId, string[]>>(initializeZOrder);

    const updateCard = (id: string, updater: (card: CardData) => CardData) => {
        setCards(prev => prev.map(card => (card.id === id ? updater(card) : card)));
    };

    const bringCardToFront = (id: string) => {
        setZOrder(prev => {
            const sceneStack = prev[activeScene] || [];
            const without = sceneStack.filter(cardId => cardId !== id);
            const updated = [...without, id];
            const next = { ...prev, [activeScene]: updated };
            localStorage.setItem('zOrder', JSON.stringify(next));
            return next;
        });
    };

    const cardsInActiveSet = useMemo(() => cards.filter(card => card.set === activeSet), [cards, activeSet]);
    const pickedCards = useMemo(() => cardsInActiveSet.filter(card => card.picked), [cardsInActiveSet]);
    const unpickedCards = useMemo(() => cardsInActiveSet.filter(card => !card.picked), [cardsInActiveSet]);
    const nextCard = unpickedCards[0];

    const handleReset = () => {
        localStorage.removeItem('cards');
        localStorage.removeItem('zOrder');
        setCards(initializeCards());
        setZOrder(initializeZOrder());
    };

    const handleSaveSceneImage = async () => {
        if (!sceneRef.current) return;
        try {
            const canvas = await html2canvas(sceneRef.current);
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `scene-${activeScene}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Image export failed:', error);
        }
    };

    useEffect(() => {
        localStorage.setItem('cards', JSON.stringify(cards));
    }, [cards]);

    useEffect(() => {
        const keyActions: Record<string, () => void> = {
            f: () => {
                const next = cards.find(c => c.set === activeSet && !c.picked);
                if (next) updateCard(next.id, c => ({ ...c, picked: true }));
            },
            d: () => {
                const last = [...cards].reverse().find(c => c.set === activeSet && c.picked);
                if (last) updateCard(last.id, c => ({ ...c, picked: false }));
            },
            v: () => setActiveScene(prev => (prev === 'a' ? 'b' : 'a')),
            '?': () => setShortcutOpen(true),
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            const action = keyActions[e.key];
            if (action) action();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cards, activeSet, activeScene]);

    const handleDragEnd = ({ active, delta }: DragEndEvent) => {
        setCards(prev =>
            prev.map(card => {
                if (card.id === active.id) {
                    const { x, y } = card.positions[activeScene];
                    return {
                        ...card,
                        positions: {
                            ...card.positions,
                            [activeScene]: {
                                x: x + delta.x,
                                y: y + delta.y,
                            },
                        },
                    };
                }
                return card;
            })
        );
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    const availableSets = useMemo(() => [...new Set(cards.map(c => c.set))], [cards]);


    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ p: 0 }}>
                <Grid container spacing={2}>
                    <Grid size={2} sx={{ pt: 6 }}>
                        <Stack spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel id="card-set-label">Kártya készlet</InputLabel>
                                <Select
                                    labelId="card-set-label"
                                    size="small"
                                    value={activeSet}
                                    label="Kártya készlet"
                                    onChange={(e) => setActiveSet(e.target.value)}
                                >
                                    {availableSets.map(setId => (
                                        <MenuItem key={setId} value={setId}>
                                            Készlet {setId}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                size="small"
                                variant="text"
                                color="error"
                                startIcon={<ReplayIcon />}
                                onClick={() => setConfirmOpen(true)}
                            >
                                Alaphelyzet
                            </Button>
                            <Typography variant="caption" color="text.secondary" textAlign={'center'}>
                                Billentyűparancsok: '?'
                            </Typography>
                        </Stack>
                    </Grid>

                    <Grid size={10}>
                        <Grid container alignItems="center" justifyContent="space-between">
                            <Grid size={8}>
                                <Tabs value={activeScene} onChange={(e, val) => setActiveScene(val)}>
                                    <Tab label="Jelenet A" value="a" />
                                    <Tab label="Jelenet B" value="b" />
                                </Tabs>
                            </Grid>
                            <Grid size={4} display="flex" justifyContent="flex-end" alignItems="center">
                                <Tooltip title="Jelenet mentése képként">
                                    <IconButton onClick={handleSaveSceneImage}
                                        sx={{ mr: 2 }}
                                    >
                                        <PhotoCameraIcon />
                                    </IconButton>
                                </Tooltip>
                                <ButtonGroup>
                                    <Button
                                        variant="text"
                                        color="secondary"
                                        startIcon={<RemoveCircleIcon />}
                                        disabled={pickedCards.length === 0}
                                        onClick={() => {
                                            const last = [...cards].reverse().find(c => c.set === activeSet && c.picked);
                                            if (last) updateCard(last.id, c => ({ ...c, picked: false }));
                                        }}
                                    >
                                        Visszavétel ({pickedCards.length})
                                    </Button>
                                    <Tooltip title={nextCard ? `Következő kártya ID: ${nextCard.id}` : 'Nincs több kártya'}>
                                        <span>
                                            <Button
                                                variant="text"
                                                startIcon={<AddCircleIcon />}
                                                disabled={!nextCard}
                                                onClick={() => {
                                                    if (nextCard) updateCard(nextCard.id, c => ({ ...c, picked: true }));
                                                }}
                                            >
                                                Következő ({unpickedCards.length})
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </ButtonGroup>
                            </Grid>
                        </Grid>

                        <DndContext
                            sensors={sensors}
                            // onDragStart={(e) => setLastDraggedCardId(e.active.id as string)}
                            onDragStart={(event) => {
                                bringCardToFront(event.active.id as string);
                            }}
                            onDragEnd={handleDragEnd}
                            modifiers={[restrictToParentElement]}
                        >
                            <Box
                                ref={sceneRef}
                                sx={{
                                    width: 1200,
                                    height: 800,
                                    position: 'relative',
                                    border: '1px solid gray',
                                    backgroundImage: `url(/scene-a-bg.png)`,
                                    backgroundSize: 'cover',
                                }}
                            >
                                {pickedCards.map(card => (
                                    <DraggableCard
                                        key={card.id}
                                        id={card.id}
                                        card={card}
                                        scene={activeScene}
                                        activeCardId={lastDraggedCardId}
                                        zOrder={zOrder[activeScene] || []}
                                    />
                                ))}
                            </Box>
                        </DndContext>

                        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                            <DialogTitle>Alaphelyzet visszaállítása</DialogTitle>
                            <DialogContent>
                                <DialogContentText>
                                    Biztosan visszaállítod az alaphelyzetet? Az összes kártya lekerül minden tábláról. Ez a művelet nem visszavonható!
                                </DialogContentText>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => { handleReset(); setConfirmOpen(false); }} color="error" variant="text">
                                    Igen, visszaállítom
                                </Button>
                                <Button onClick={() => setConfirmOpen(false)} variant='contained'>Mégse</Button>
                            </DialogActions>
                        </Dialog>

                        <Dialog open={shortcutOpen} onClose={() => setShortcutOpen(false)}>
                            <DialogTitle>Gyorsbillentyűk</DialogTitle>
                            <DialogContent>
                                <DialogContentText>
                                    <ul style={{ paddingLeft: '1.2em' }}>
                                        <li><strong>f</strong>: Következő kártya hozzáadása</li>
                                        <li><strong>d</strong>: Utolsó kártya visszavétele</li>
                                        <li><strong>v</strong>: Jelenet váltás (A &lt;-&gt; B)</li>
                                        <li><strong>?</strong>: Ennek a segítségnek a megjelenítése</li>
                                    </ul>
                                </DialogContentText>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setShortcutOpen(false)} variant="contained">
                                    Bezárás
                                </Button>
                            </DialogActions>
                        </Dialog>
                    </Grid>
                </Grid>
            </Box>
        </ThemeProvider>
    );
}
