#include <stdio.h>

// Function with a single operation
void single_operation()
{
    int a = 5;
}

// Function with constant iterations loop
void constant_loop()
{
    int i = 0;
    for (i = 0; i < 10; i++)
    {
        int l = 0;
        int k = 0;
        int m = 0;
    }
}

// Function performing arithmetic operations
void arithmetic_operations()
{
    int a = 5;
    int b = 10;
    int c = a + b;
    int d = a * b;
    int e = d / c;
}

// Function with a conditional statement (no loop)
void constant_conditional()
{
    int a = 10, b = 20;
    if (a < b)
    {
        int c = a + b;
    }
    else
    {
        int c = a - b;
    }
}

// Function with a fixed-size array
void fixed_array_operations()
{
    int arr[5] = {1, 2, 3, 4, 5};
    arr[0] = arr[1] + arr[2];
    arr[4] = arr[3] * arr[0];
}

// // Function with a switch statement
void constant_switch()
{
    int option = 2;
    switch (option)
    {
    case 1:
        option += 10;
        break;
    case 2:
        option -= 5;
        break;
    case 3:
        option *= 2;
        break;
    default:
        option = 0;
        break;
    }
}

// Main function
int main()
{
    // Call constant - time complexity functions
    single_operation();
    constant_loop();
    arithmetic_operations();
    constant_conditional();
    fixed_array_operations();
    constant_switch();

    return 0;
}
