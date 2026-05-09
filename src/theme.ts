'use client';

import { createTheme } from '@mantine/core';

export const theme = createTheme({
  defaultRadius: 'xs',
  fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
  components: {
    TextInput: {
      styles: () => ({
        label: {
          fontWeight: 'bold'
        }
      })
    },
    NumberInput: {
      styles: () => ({
        label: {
          fontWeight: 'bold'
        }
      })
    },
    RadioGroup: {
      styles: () => ({
        label: {
          fontWeight: 'bold'
        }
      })
    },
    DatePicker: {
      styles: () => ({
        label: {
          fontWeight: 'bold'
        },
        day: {
          height: 30
        }
      })
    }
  }
});
