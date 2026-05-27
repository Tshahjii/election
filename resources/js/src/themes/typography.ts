// ==============================|| DEFAULT - TYPOGRAPHY ||============================== //

export default function typography(fontScale = 'normal') {
  const scale = fontScale === 'large' ? 1.08 : 1;
  const rem = (value) => `${value * scale}rem`;

  return {
    fontFamily: `'Poppins', sans-serif`,
    h6: {
      fontWeight: 600,
      fontSize: rem(0.875)
    },
    h5: {
      fontSize: rem(1.125),
      fontWeight: 600
    },
    h4: {
      fontSize: rem(1.25),
      fontWeight: 500
    },
    h3: {
      fontSize: rem(1.5),
      fontWeight: 600
    },
    h2: {
      fontSize: rem(2),
      fontWeight: 600
    },
    h1: {
      fontSize: rem(2.2),
      fontWeight: 600
    },
    subtitle1: {
      fontSize: rem(0.875),
      fontWeight: 500,
      lineHeight: '1.643em'
    },
    subtitle2: {
      fontSize: rem(0.8125),
      fontWeight: 400
    },
    caption: {
      fontSize: rem(0.68),
      fontWeight: 500
    },
    body1: {
      fontSize: rem(0.875),
      fontWeight: 400,
      lineHeight: '1.643em'
    },
    body2: {
      letterSpacing: '0em',
      fontWeight: 400,
      lineHeight: '1.643em'
    },
    menuCaption: {
      fontSize: rem(0.6875),
      fontWeight: 600,
      padding: '5px 15px 5px',
      textTransform: 'uppercase',
      marginTop: '10px'
    },
    subMenuCaption: {
      fontSize: rem(0.6875),
      fontWeight: 400,
      textTransform: 'capitalize'
    }
  };
}
