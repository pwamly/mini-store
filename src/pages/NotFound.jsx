'use strict';

import { useNavigate } from 'react-router-dom';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';

// icons
import HomeOutlined from '@ant-design/icons/HomeOutlined';
import ArrowLeftOutlined from '@ant-design/icons/ArrowLeftOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import FileSearchOutlined from '@ant-design/icons/FileSearchOutlined';

// project imports
import MainCard from 'components/MainCard';

// ==============================|| 404 - NOT FOUND ||============================== //

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleProducts = () => {
    navigate('/products');
  };

  const handleSales = () => {
    navigate('/sales');
  };

  return (
    <Grid
      container
      sx={{
        minHeight: 'calc(100vh - 100px)',
        alignItems: 'center',
        justifyContent: 'center',
        py: {
          xs: 3,
          md: 5
        }
      }}
    >
      <Grid size={{ xs: 12, sm: 10, md: 9, lg: 7, xl: 6 }}>
        <MainCard>
          <Stack spacing={4}>

            {/* =============================================
                TOP SECTION
            ============================================= */}

            <Stack
              spacing={2}
              sx={{
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              {/* ICON */}
              <Box
                sx={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.lighter',
                  color: 'primary.main'
                }}
              >
                <FileSearchOutlined
                  style={{
                    fontSize: '2.8rem'
                  }}
                />
              </Box>

              {/* 404 */}
              <Typography
                variant="h1"
                color="primary"
                sx={{
                  fontSize: {
                    xs: '5rem',
                    sm: '7rem',
                    md: '8rem'
                  },
                  fontWeight: 800,
                  lineHeight: 0.9,
                  letterSpacing: '-0.06em'
                }}
              >
                404
              </Typography>

              {/* TITLE */}
              <Stack spacing={1}>
                <Typography
                  variant="h3"
                  fontWeight={700}
                >
                  Page Not Found
                </Typography>

                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    maxWidth: 520,
                    mx: 'auto',
                    lineHeight: 1.7
                  }}
                >
                  Sorry, we couldn't find the page you're
                  looking for. The page may have been removed,
                  renamed, or the address may be incorrect.
                </Typography>
              </Stack>

              {/* STATUS */}
              <Chip
                label="Error 404"
                color="error"
                variant="outlined"
                size="small"
              />
            </Stack>

            <Divider />

            {/* =============================================
                HELP TEXT
            ============================================= */}

            <Stack
              spacing={1}
              sx={{
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <Typography
                variant="h6"
                fontWeight={600}
              >
                Where would you like to go?
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Use one of the options below to continue
                using the store.
              </Typography>
            </Stack>

            {/* =============================================
                QUICK NAVIGATION
            ============================================= */}

            <Grid
              container
              spacing={2}
            >
              {/* DASHBOARD */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<HomeOutlined />}
                  onClick={handleGoHome}
                  sx={{
                    py: 1.3,
                    textTransform: 'capitalize'
                  }}
                >
                  Dashboard
                </Button>
              </Grid>

              {/* PRODUCTS */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<SearchOutlined />}
                  onClick={handleProducts}
                  sx={{
                    py: 1.3,
                    textTransform: 'capitalize'
                  }}
                >
                  Products
                </Button>
              </Grid>

              {/* SALES */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={handleSales}
                  sx={{
                    py: 1.3,
                    textTransform: 'capitalize'
                  }}
                >
                  Sales
                </Button>
              </Grid>
            </Grid>

            {/* =============================================
                GO BACK
            ============================================= */}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Button
                color="secondary"
                startIcon={<ArrowLeftOutlined />}
                onClick={handleGoBack}
                sx={{
                  textTransform: 'capitalize'
                }}
              >
                Go Back to Previous Page
              </Button>
            </Box>

            {/* =============================================
                FOOTER MESSAGE
            ============================================= */}

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'grey.50',
                textAlign: 'center'
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
              >
                If you believe this page should exist, please
                check the URL or contact your administrator.
              </Typography>
            </Box>

          </Stack>
        </MainCard>
      </Grid>
    </Grid>
  );
}
