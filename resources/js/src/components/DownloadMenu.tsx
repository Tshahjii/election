import { useState } from 'react';

import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import GridOnOutlined from '@mui/icons-material/GridOnOutlined';
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined';

import { downloadExcelFile, downloadPdfReport, ExportColumn } from 'utils/exportData';

type DownloadMenuProps = {
  title: string;
  columns: ExportColumn[];
  rows: Record<string, any>[];
  disabled?: boolean;
};

export default function DownloadMenu({ title, columns, rows, disabled = false }: DownloadMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const close = () => setAnchorEl(null);

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<DownloadOutlined />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        disabled={disabled}
        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2.25 }}
      >
        Download
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={close} slotProps={{ paper: { sx: { minWidth: 210, borderRadius: 1.5 } } }}>
        <MenuItem
          onClick={() => {
            downloadExcelFile(title, columns, rows);
            close();
          }}
        >
          <ListItemIcon>
            <GridOnOutlined fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText primary="Excel Export" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            downloadPdfReport(title, columns, rows);
            close();
          }}
        >
          <ListItemIcon>
            <PictureAsPdfOutlined fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="PDF Download" />
        </MenuItem>
      </Menu>
    </>
  );
}
