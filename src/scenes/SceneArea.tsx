import { Box, Typography } from "@mui/material";

interface Props {
    name?: string;
    empty?: boolean;
    height?: number;
}

export default function SceneArea(
    {
        name = '',
        empty = false,
        height = 15,
    }: Props

) {
    const style = {
        outlineOffset: '-1px',
        height: empty ? "100px" : height + "%",
        flexGrow: empty ? 0 : 1,
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        backgroundColor: empty ? 'divider' : 'background.paper',
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
                color: 'text.secondary',
            }} >
                <Typography variant="h6" align="center">
                    {name ? name : "Scene Area"}
                </Typography>
            </Box>}
        </Box >

    );
}
