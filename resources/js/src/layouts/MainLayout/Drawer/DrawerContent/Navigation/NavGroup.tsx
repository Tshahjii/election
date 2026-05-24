import PropTypes from 'prop-types';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';

// project imports
import { useAppPreferences } from 'contexts/AppPreferences';
import NavCollapse from './NavCollapse';
import NavItem from './NavItem';

// ==============================|| RESPONSIVE DRAWER - GROUP ||============================== //

export default function NavGroup({ item }) {
  const { t } = useAppPreferences();

  const renderNavItem = (menuItem) => {
    // Render items based on the type
    switch (menuItem.type) {
      case 'collapse':
        return <NavCollapse key={menuItem.id} item={menuItem} level={1} />;
      case 'item':
        return <NavItem key={menuItem.id} item={menuItem} level={1} />;
      default:
        return (
          <Typography key={menuItem.id} variant="h6" color="error" align="center">
            Fix - Group Collapse or Items
          </Typography>
        );
    }
  };

  return (
    <List
      component="div"
      subheader={
        <Typography component="div" sx={(theme) => ({ ...theme.typography.menuCaption, color: 'rgba(255,255,255,0.92)', px: 1.5 })} gutterBottom>
          {item.titleKey ? t(item.titleKey) : item.title}
          {item.caption && (
            <Typography component="div" sx={(theme) => ({ ...theme.typography.subMenuCaption, color: 'rgba(255,255,255,0.62)' })} gutterBottom>
              {item.captionKey ? t(item.captionKey) : item.caption}
            </Typography>
          )}
        </Typography>
      }
    >
      {item.children?.map((menuItem) => renderNavItem(menuItem))}
    </List>
  );
}

NavGroup.propTypes = { item: PropTypes.any };
