import { useFireCMSContext } from "./useFireCMSContext";
import { ConfigurationPersistence } from "../models/config_persistence";
import { UserConfigurationPersistence } from "../models";


/**
 * Use this controller to access the configuration that is stored extenally,
 * and not defined in code
 *
 * @category Hooks and utilities
 */
export function useUserConfigurationPersistence(): UserConfigurationPersistence | undefined {
    const context = useFireCMSContext();
    return context.userConfigPersistence;
}
