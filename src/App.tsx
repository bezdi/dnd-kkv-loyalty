import { useState, useEffect, useRef, useMemo } from 'react';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './App.css';
import rawCards from '@/data/cards.json';
import rawDiscounts from '@/data/discounts.json';
import type { CardData, Position, SceneId } from '@/types/card';
import type { CategoryMap } from '@/types/discounts';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import ReplayIcon from '@mui/icons-material/Replay';
import html2canvas from 'html2canvas';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import {
    Box, Button, ButtonGroup, Dialog, DialogActions, DialogContent, DialogContentText,
    DialogTitle, FormControl, FormControlLabel, Grid, IconButton, InputLabel, List, ListItem, MenuItem,
    Paper, Select, Stack, Switch, Tab, Tabs, TextField, Tooltip, Typography
} from '@mui/material';
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import type { DragEndEvent } from '@dnd-kit/core';
import { DraggableCard } from './components/DraggableCard';
import Scene from './scenes/Scene';

const SCENES: SceneId[] = ['1', '2'];


const getInitialPicked = (sets: string[]): Record<string, boolean> => {
    return sets.reduce<Record<string, boolean>>((acc, setId) => {
        acc[setId] = false;
        return acc;
    }, {});
};
const getInitialPositions = (
    scenes: SceneId[],
    sets: string[]
): Record<SceneId, Record<string, Position>> => {
    return scenes.reduce<Record<SceneId, Record<string, Position>>>(
        (sceneAcc, scene) => {
            sceneAcc[scene] = sets.reduce<Record<string, Position>>((setAcc, setId) => {
                setAcc[setId] = { x: 0, y: 0 };
                return setAcc;
            }, {});
            return sceneAcc;
        },
        {} as Record<SceneId, Record<string, Position>>
    );
};

const initializeCards = (): CardData[] => {
    const saved = localStorage.getItem('cards');
    if (saved) return JSON.parse(saved) as CardData[];

    return rawCards.map((card: any): CardData => {
        const sets: string[] = Array.isArray(card.sets)
            ? card.sets
            : Array.isArray(card.set)
                ? card.set
                : [card.set ?? 'a'];

        return {
            id: card.id,
            text: card.text,
            sets,
            picked: getInitialPicked(sets),
            positions: getInitialPositions(SCENES, sets),
        };
    });
};


const initializeZOrder = (): Record<SceneId, Record<string, string[]>> => {
    const saved = localStorage.getItem('zOrder');
    if (saved) return JSON.parse(saved);

    return SCENES.reduce((sceneAcc, scene) => {
        return {
            ...sceneAcc,
            [scene]: {}
        };
    }, {} as Record<SceneId, Record<string, string[]>>);
};

const sanitizeFilename = (input: string): string => {
    return input
        .toLowerCase()
        .replace(/[á]/g, 'a')
        .replace(/[é]/g, 'e')
        .replace(/[í]/g, 'i')
        .replace(/[óöő]/g, 'o')
        .replace(/[úüű]/g, 'u')
        .replace(/[^a-z0-9_-]/g, ''); // final strip: keep only safe characters
};
export default function App() {
    const theme = createTheme({});
    const sceneRef = useRef<HTMLDivElement>(null);

    const [activeSet, setActiveSet] = useState<string>('a');
    const [activeScene, setActiveScene] = useState<SceneId>('1');
    const [cards, setCards] = useState<CardData[]>(initializeCards);
    const [discounts, setDiscount] = useState<CategoryMap>(rawDiscounts);
    const [lastDraggedCardId] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [shortcutOpen, setShortcutOpen] = useState(false);
    const [zOrder, setZOrder] = useState<Record<SceneId, Record<string, string[]>>>(initializeZOrder);
    const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);
    const [showCardTooltips, setShowCardTooltips] = useState<boolean>(false);
    const [identifier, setIdentifier] = useState<string>(() => {
        return localStorage.getItem('identifier') || '';
    });

    const getInitialDropPosition = (): Position => {
        return {
            x: 1200 / 2 - 220 / 2, // assuming card is 220px wide
            y: 800 - 90 // assuming card height + padding from bottom
        };
    };

    const updateCard = (id: string, updater: (card: CardData) => CardData) => {
        setCards(prev =>
            prev.map(card => {
                if (card.id !== id) return card;

                const updatedCard = updater({ ...card }); // clone shallowly

                // Check if card has ever been moved
                const hasAnyNonZeroPosition = Object.values(updatedCard.positions).some(scene =>
                    Object.values(scene).some(pos => pos.x !== 0 || pos.y !== 0)
                );

                if (!hasAnyNonZeroPosition) {
                    const newPositions: typeof updatedCard.positions = { ...updatedCard.positions };

                    // Set initial drop position for current set in all scenes
                    for (const sceneId of SCENES) {
                        newPositions[sceneId] = {
                            ...newPositions[sceneId],
                            [activeSet]: getInitialDropPosition(),
                        };
                    }

                    updatedCard.positions = newPositions;
                }

                return updatedCard;
            })
        );
    };

    const bringCardToFront = (id: string) => {
        setZOrder(prev => {
            const sceneStack = prev[activeScene]?.[activeSet] || [];
            const without = sceneStack.filter(cardId => cardId !== id);
            const updated = [...without, id];
            const next = {
                ...prev,
                [activeScene]: {
                    ...prev[activeScene],
                    [activeSet]: updated
                }
            };
            localStorage.setItem('zOrder', JSON.stringify(next));
            return next;
        });
    };

    const cardsInActiveSet = useMemo(
        () => cards.filter(card => card.sets.includes(activeSet)),
        [cards, activeSet]
    );

    const pickedCards = useMemo(
        () => cardsInActiveSet.filter(card => card.picked[activeSet]),
        [cardsInActiveSet]
    );

    const unpickedCards = useMemo(() => cardsInActiveSet.filter(card => !card.picked[activeSet]), [cardsInActiveSet]);
    const nextCard = unpickedCards[0];
    const lastPickedCard = useMemo(() =>
        [...cards].reverse().find(c => c.sets.includes(activeSet) && c.picked[activeSet]),
        [cards, activeSet]);

    const handleReset = () => {
        localStorage.removeItem('cards');
        localStorage.removeItem('zOrder');
        localStorage.removeItem('identifier');
        setCards(initializeCards());
        setZOrder(initializeZOrder());
    };

    const handleSaveSceneImage = async () => {
        if (!sceneRef.current) return;

        try {
            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, '0');

            const datePart = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${pad(now.getFullYear() % 100)}`;
            const timePart = `${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`;
            const safeIdentifier = sanitizeFilename(identifier || 'unnamed');
            const fileName = `${datePart}_${timePart}-${safeIdentifier}-${activeScene}.png`;

            const canvas = await html2canvas(sceneRef.current);
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Image export failed:', error);
        }
    };

    const handleSaveBothScenes = async () => {
        if (!sceneRef.current) return;

        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        //const datePart = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${pad(now.getFullYear() % 100)}`;
        const datePart = `${pad(now.getFullYear() % 100)}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
        const timePart = `${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`;
        const safeIdentifier = sanitizeFilename(identifier || 'unnamed');

        const captureScene = async (sceneId: SceneId) => {
            setActiveScene(sceneId);
            await new Promise(resolve => setTimeout(resolve, 300)); // wait for scene to render

            const canvas = await html2canvas(sceneRef.current as HTMLDivElement);
            const fileName = `${datePart}_${timePart}-${safeIdentifier}-${sceneId}.png`;

            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataUrl;
            link.click();
        };

        const originalScene = activeScene;
        for (const scene of SCENES) {
            await captureScene(scene);
        }
        setActiveScene(originalScene);
    };

    useEffect(() => {
        localStorage.setItem('cards', JSON.stringify(cards));
    }, [cards]);
    useEffect(() => {
        localStorage.setItem('identifier', identifier);
    }, [identifier]);

    useEffect(() => {
        const keyActions: Record<string, () => void> = {
            f: () => {
                const next = cards.find(c => c.sets.includes(activeSet) && !c.picked[activeSet]);
                if (next) updateCard(next.id, c => ({
                    ...c,
                    picked: { ...c.picked, [activeSet]: true }
                }));
            },
            d: () => {
                const last = [...cards].reverse().find(c => c.sets.includes(activeSet) && c.picked[activeSet]);
                if (last) updateCard(last.id, c => ({
                    ...c,
                    picked: { ...c.picked, [activeSet]: false }
                }));
            },
            g: () => setActiveScene(prev => (prev === '1' ? '2' : '1')),
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
                    const prevPos = card.positions[activeScene]?.[activeSet] || { x: 0, y: 0 };
                    const updated = {
                        ...card,
                        positions: {
                            ...card.positions,
                            [activeScene]: {
                                ...card.positions[activeScene],
                                [activeSet]: {
                                    x: prevPos.x + delta.x,
                                    y: prevPos.y + delta.y,
                                }
                            }
                        }
                    };
                    return updated;
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

    const availableSets = useMemo(() => {
        const allSets = cards.flatMap(c => c.sets);
        return [...new Set(allSets)];
    }, [cards]);


    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ p: 0, px: 2 }}>
                <Grid container spacing={2} sx={{ width: "1444px" }}>
                    <Grid size={2} sx={{ pt: 6 }}>
                        <Stack spacing={2}>
                            <FormControl fullWidth>
                                <TextField
                                    label="Azonosító"
                                    size="small"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    fullWidth
                                    sx={{ mb: 2 }}
                                />
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel id="card-set-label">Alminta</InputLabel>
                                <Select
                                    labelId="card-set-label"
                                    size="small"
                                    value={activeSet}
                                    label="Alminta"
                                    onChange={(e) => setActiveSet(e.target.value)}
                                >
                                    {availableSets.map(setId => (
                                        <MenuItem key={setId} value={setId}>
                                            "{setId.toUpperCase()}" alminta
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormControlLabel
                                    sx={{ mt: 2, px: 1 }}
                                    control={
                                        <Switch
                                            checked={showCardTooltips}
                                            onChange={(e) => setShowCardTooltips(e.target.checked)}
                                        />
                                    }
                                    label="Kártya információk"
                                />
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
                                    <Tab label="Táblázat 1" value="1" />
                                    <Tab label="Táblázat 2" value="2" />
                                </Tabs>
                            </Grid>
                            <Grid size={4} display="flex" justifyContent="flex-end" alignItems="center">
                                <Tooltip title="Jelenetek mentése képként" disableInteractive arrow>
                                    <IconButton onClick={handleSaveBothScenes}
                                        sx={{ mr: 2 }}
                                    >
                                        <PhotoCameraIcon />
                                    </IconButton>
                                </Tooltip>
                                <ButtonGroup>
                                    <Tooltip
                                        title={lastPickedCard ? `Utoljára lettet kártya ID: ${lastPickedCard.id}` : 'Nincs mit visszavenni'}
                                        disableInteractive
                                        arrow
                                    >
                                        <span>
                                            <Button
                                                variant="text"
                                                color="secondary"
                                                startIcon={<RemoveCircleIcon />}
                                                disabled={!lastPickedCard}
                                                onClick={() => {
                                                    if (lastPickedCard) {
                                                        updateCard(lastPickedCard.id, c => ({
                                                            ...c,
                                                            picked: { ...c.picked, [activeSet]: false }
                                                        }));

                                                        // Immediately calculate the next card to highlight
                                                        const nextLast = [...cards]
                                                            .reverse()
                                                            .filter(c => c.id !== lastPickedCard.id) // exclude the one just removed
                                                            .find(c => c.sets.includes(activeSet) && c.picked[activeSet]);

                                                        setHighlightedCardId(nextLast?.id ?? null);
                                                    }
                                                }}
                                                onMouseEnter={() => {
                                                    if (lastPickedCard) setHighlightedCardId(lastPickedCard.id);
                                                }}
                                                onMouseLeave={() => setHighlightedCardId(null)}
                                            >
                                                Visszavétel ({pickedCards.length})
                                            </Button>
                                        </span>
                                    </Tooltip>
                                    <Tooltip
                                        title={nextCard ? `Következő kártya ID: ${nextCard.id}` : 'Nincs több kártya'}
                                        disableInteractive
                                        arrow
                                    >
                                        <span>
                                            <Button
                                                variant="text"
                                                startIcon={<AddCircleIcon />}
                                                disabled={!nextCard}
                                                onClick={() => {
                                                    if (nextCard) updateCard(nextCard.id, c => ({
                                                        ...c,
                                                        picked: { ...c.picked, [activeSet]: true }
                                                    }));
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
                                    border: '1px solid',
                                    borderTop: 0,
                                    borderColor: 'divider',
                                    // backgroundImage: `url(/scene-a-bg.png)`,
                                    backgroundSize: 'cover',
                                }}
                            >
                                {pickedCards.map(card => {
                                    const categoryId = Math.floor(Number(card.id) / 100).toString();
                                    const color = discounts?.[categoryId as keyof CategoryMap]?.color || '#F2F6FA';
                                    const borderColor = discounts?.[categoryId as keyof CategoryMap]?.borderColor || '#F2F6FA';
                                    const categoryName = discounts?.[categoryId as keyof CategoryMap]?.desc || 'N/A';

                                    return (
                                        <DraggableCard
                                            key={card.id}
                                            id={card.id}
                                            card={card}
                                            scene={activeScene}
                                            activeSet={activeSet}
                                            activeCardId={lastDraggedCardId}
                                            zOrder={zOrder[activeScene]?.[activeSet] || []}
                                            color={color}
                                            borderColor={borderColor}
                                            highlighted={card.id === highlightedCardId}
                                            tooltip={showCardTooltips ? `ID: ${card.id} | Kategória: ${categoryName}` : undefined}

                                        />
                                    );
                                })}
                                <Scene name={activeScene} label={identifier} />
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
                                        <li><strong>g</strong>: Jelenet váltás (1 &lt;-&gt; 2)</li>
                                        <li><strong>?</strong>: A gyorsbillentyűk megjelenítése (ez az ablak)</li>
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
