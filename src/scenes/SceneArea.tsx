import { Box, Typography } from "@mui/material";

interface Props {
    name?: string;
    empty?: boolean;
    height?: number;
    label?: string;
}

export default function SceneArea(
    {
        name = '',
        empty = false,
        height = 15,
        label = '',
    }: Props

) {
    const style = {
        outlineOffset: '-1px',
        height: empty ? "100px" : height + "%",
        flexGrow: empty ? 0 : 1,
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        backgroundColor: empty ? '#cecece' : 'background.paper',
    }

    return (
        <Box sx={style}>
            {!empty && <Box sx={{
                width: '200px',
                marginLeft: 'auto',
                borderLeft: "1px dashed",
                borderColor: "divider",
                display: 'flex',
                alignItems: 'center',
                p: 2,
                justifyContent: 'center',
                color: 'text.primary',
                fontWeight: 'bold',
            }} >
                <Typography variant="body1" align="center" fontWeight={400}>
                    {name ? name : "Scene Area"}
                </Typography>
            </Box>}
            {empty && label && (
                <Box sx={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'right',
                    color: 'text.secondary',
                    fontStyle: 'italic',
                    p: 1,
                    opacity: 0.8,
                }}>
                    <Typography variant="caption">{label}</Typography>
                </Box>
            )}
        </Box >

    );
}
