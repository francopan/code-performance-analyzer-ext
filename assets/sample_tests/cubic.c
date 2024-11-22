#include <stdio.h>

// Cubic-time complexity function with three nested loops
void cubic_loop(int n)
{
    int i = 0, j = 0, k = 0;
    for (i = 0; i < n; i++)
    {
        for (j = 0; j < n; j++)
        {
            for (k = 0; k < n; k++)
            {
                int l = 0;
                int m = 0;
                int o = 0;
            }
        }
    }
}

// // Cubic-time complexity function with array manipulation
void cubic_array_operations(int arr[], int n)
{
    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < n; j++)
        {
            for (int k = 0; k < n; k++)
            {
                arr[i] = arr[i] + arr[j] + arr[k]; // Manipulate elements based on all combinations of i, j, k
            }
        }
    }
}

// Cubic-time complexity function with nested loops and condition
void cubic_with_condition(int n)
{
    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < n; j++)
        {
            for (int k = 0; k < n; k++)
            {
                if (i == j && j == k)
                {
                    int temp = i * j * k; // Perform operation only when i, j, k are equal
                }
            }
        }
    }
}

// // Cubic-time complexity function with nested loops and arithmetic operations
void cubic_with_arithmetic(int n)
{
    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < n; j++)
        {
            for (int k = 0; k < n; k++)
            {
                int result = (i + j + k) * (i - j + k); // Perform arithmetic operation with all indices
            }
        }
    }
}

// // Cubic-time complexity function with nested loops performing independent operations
void cubic_independent_operations(int n)
{
    for (int i = 0; i < n; i++)
    {
        int x = i * i * i; // Independent operation in the first loop
    }
    for (int j = 0; j < n; j++)
    {
        int y = j * j * j; // Independent operation in the second loop
    }
    for (int k = 0; k < n; k++)
    {
        int z = k * k * k; // Independent operation in the third loop
    }
}

// Main function for testing
int main()
{
    int n;
    printf("Enter a value for n: ");
    scanf("%d", &n);

    int arr[n];
    for (int i = 0; i < n; i++)
    {
        arr[i] = i;
    }

    // Call cubic - time complexity functions
    cubic_loop(n);
    cubic_array_operations(arr, n);
    cubic_with_condition(n);
    cubic_with_arithmetic(n);
    cubic_independent_operations(n);

    return 0;
}
