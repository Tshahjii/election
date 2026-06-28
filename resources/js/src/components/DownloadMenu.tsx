import { useState } from 'react';

import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';

import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import GridOnOutlined from '@mui/icons-material/GridOnOutlined';
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined';

import { downloadExcelFile, downloadPdfReport, ExportColumn } from 'utils/exportData';

type DownloadMenuProps = {
  title: string;
  columns: ExportColumn[];
  rows?: Record<string, any>[];
  getRowsLazy?: () => Promise<Record<string, any>[]>;
  disabled?: boolean;
};

export default function DownloadMenu({ title, columns, rows = [], getRowsLazy, disabled = false }: DownloadMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isFetching, setIsFetching] = useState(false);
  const open = Boolean(anchorEl);

  const close = () => setAnchorEl(null);

  const handleExport = async (format: 'excel' | 'pdf') => {
    close();
    let data = rows;
    if (getRowsLazy) {
      setIsFetching(true);
      try {
        data = await getRowsLazy();
      } catch (error) {
        console.error('Export failed', error);
        setIsFetching(false);
        return;
      }
      setIsFetching(false);
    }

    if (!data || data.length === 0) return;

    if (format === 'excel') {
      downloadExcelFile(title, columns, data);
    } else {
      downloadPdfReport(title, columns, data);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        startIcon={isFetching ? <CircularProgress size={16} color="inherit" /> : <DownloadOutlined />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        disabled={disabled || isFetching}
        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2.25 }}
      >
        {isFetching ? 'Loading...' : 'Download'}
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={close} slotProps={{ paper: { sx: { minWidth: 210, borderRadius: 1.5 } } }}>
        <MenuItem onClick={() => handleExport('excel')}>
          <ListItemIcon>
            <GridOnOutlined fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText primary="Excel Export" />
        </MenuItem>
        <MenuItem onClick={() => handleExport('pdf')}>
          <ListItemIcon>
            <PictureAsPdfOutlined fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="PDF Download" />
        </MenuItem>
      </Menu>
    </>
  );
}
