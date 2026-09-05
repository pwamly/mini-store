// material-ui
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function Footer() {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ gap: 1.5, alignItems: 'center', justifyContent: 'space-between', p: '24px 16px 0px', mt: 'auto' }}
    >
      <Typography variant="caption">
        &copy; All rights reserved{' '}
        <Link href="https://necbot.store/" target="_blank" underline="hover">
          Necbot
        </Link>
      </Typography>
      <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="https://necbot.store/" target="_blank" variant="caption" color="text.primary">
          Hire us
        </Link>
        <Link href="https://necbot.store/" target="_blank" variant="caption" color="text.primary">
          License
        </Link>
        <Link href="https://necbot.store/" target="_blank" variant="caption" color="text.primary">
          Terms
        </Link>
       </Stack>
    </Stack>
  );
}
