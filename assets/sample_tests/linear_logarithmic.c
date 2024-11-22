#include <stdio.h>

// Linear-logarithmic-time complexity function with nested loop
void linear_logarithmic_loop(int n)
{
    for (int i = 0; i < n; i++)
    {
        int j = 1;
        while (j < n)
        {
            j *= 2; // Doubling each step
        }
    }
}

// Linear-logarithmic-time complexity function with array processing
void linear_logarithmic_array(int arr[], int n)
{
    for (int i = 0; i < n; i++)
    {
        int j = 1;
        while (j < n)
        {
            arr[i] += j;
            j *= 2; // Doubling each step
        }
    }
}

// Linear-logarithmic function with conditional logic
void linear_logarithmic_condition(int n)
{
    for (int i = 0; i < n; i++)
    {
        int j = 1;
        while (j < n)
        {
            if (j % 2 == 0)
            {
                int temp = j / 2;
            }
            j *= 2;
        }
    }
}

// Linear-logarithmic function with cumulative sum and inner logarithmic iteration
void linear_logarithmic_sum(int n)
{
    int total = 0;
    for (int i = 0; i < n; i++)
    {
        int j = 1;
        while (j < n)
        {
            total += j;
            j *= 2; // Doubling each step
        }
    }
    printf("Total: %d\n", total);
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

    // Call linear-logarithmic-time complexity functions
    linear_logarithmic_loop(n);
    linear_logarithmic_array(arr, n);
    linear_logarithmic_condition(n);
    linear_logarithmic_sum(n);

    return 0;
}
